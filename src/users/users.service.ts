import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constants';

export type User = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  late_count: number;
  unban_date: number | null;
  is_admin: boolean;
};

@Injectable()
export class UsersService {
  private pool: Pool;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    this.pool = new Pool({
      user: 'postgres',
      password: this.configService.get('POSTGRES_PASS'),
    });
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async createUser(email: string, username: string, password: string) {
    const passwordHash = await this.createPasswordHash(password);
    const client = await this.pool.connect();
    await client.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3)',
      [email, username, passwordHash],
    );
    client.release();
  }

  async getUser(bearerToken: string) {
    const userId = await this.getUserIdFromToken(bearerToken);
    const getResult = await this.getAtLeastOne(
      'SELECT * FROM users WHERE id = $1',
      userId,
    );
    return {
      id: getResult.id,
      username: getResult.username,
      email: getResult.email,
    };
  }

  async getUserIdByEmail(email: string) {
    const getResult = await this.getAtLeastOne(
      'SELECT * FROM users WHERE email = $1',
      email,
    );
    return getResult.id;
  }

  async getUserByUsername(username: string) {
    try {
      return await this.getAtLeastOne(
        'SELECT * FROM users WHERE username = $1',
        username,
      );
    } catch (err) {
      return {
        id: '',
        username: '',
        password_hash: '',
      };
    }
  }

  async getUserById(userIdString: string) {
    const userId = parseInt(userIdString);
    const getResult = await this.getAtLeastOne(
      'SELECT * FROM users WHERE id = $1',
      userId,
    );
    return {
      id: getResult.id,
      username: getResult.username,
      email: getResult.email,
    };
  }

  async updateUser(bearerToken: string, username?: string, password?: string) {
    const userId = await this.getUserIdFromToken(bearerToken);
    if (username) {
      await this.updateAtLeastOne(
        'UPDATE users SET username = $1 WHERE id = $2',
        [username, userId],
      );
    }
    if (password) {
      this.resetPassword(userId, password);
    }
  }

  async resetPassword(userId: number, password: string) {
    const passwordHash = await this.createPasswordHash(password);
    await this.updateAtLeastOne(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId],
    );
  }

  async getPenaltyStatus(bearerToken: string) {
    const userId = await this.getUserIdFromToken(bearerToken);
    return this.getPenaltyStatusById(userId);
  }

  async getPenaltyStatusById(userId: number) {
    const user = await this.getAtLeastOne(
      'SELECT * FROM users WHERE id = $1',
      userId,
    );
    const LATE_LIMIT = parseInt(this.configService.get('MAX_LATE_COUNT'));
    return {
      status: user.late_count < LATE_LIMIT ? 'NORMAL' : 'PENALTY',
      unBannedDate: user.unban_date,
      leftQuota: LATE_LIMIT - user.late_count,
    };
  }

  async addLateCount(userIdString: string) {
    const userId = parseInt(userIdString);
    const LATE_LIMIT = parseInt(this.configService.get('MAX_LATE_COUNT'));
    const user = await this.getAtLeastOne(
      'SELECT * FROM users WHERE id = $1',
      userId,
    );
    if (user.late_count >= LATE_LIMIT) return;
    if (user.late_count + 1 == LATE_LIMIT) {
      await this.updateAtLeastOne(
        'UPDATE users SET unban_date = current_date + 30 WHERE id = $1',
        [userId],
      );
    }
    await this.updateAtLeastOne(
      'UPDATE users SET late_count = $1 WHERE id = $2',
      [user.late_count + 1, userId],
    );
  }

  private async createPasswordHash(password: string) {
    return await bcrypt.hash(
      password,
      parseInt(this.configService.get('PASSWORD_SALT')),
    );
  }

  private async updateAtLeastOne(query, param) {
    const client = await this.pool.connect();
    const res = await client.query(query, param);
    client.release();
    if (res.rowCount == 0) throw new NotFoundException('No user found');
  }

  private async getAtLeastOne(
    query: string,
    param: string | number,
  ): Promise<User> {
    const client = await this.pool.connect();
    const res = await client.query(query, [param]);
    client.release();
    if (res.rows.length == 0) throw new NotFoundException('No user found');
    return res.rows[0];
  }

  private async getUserIdFromToken(authorization: string) {
    const [type, token] = authorization?.split(' ') ?? [];
    const bearerToken = type === 'Bearer' ? token : undefined;
    if (!bearerToken) throw new UnauthorizedException();
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
