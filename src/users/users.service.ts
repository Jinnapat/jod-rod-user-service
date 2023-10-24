import { Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

export type User = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_penalized: boolean;
  is_admin: boolean;
};

@Injectable()
export class UsersService {
  private pool: Pool;

  constructor(private configService: ConfigService) {
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

  async getUserById(id: number) {
    return await this.getAtLeastOne('SELECT * FROM users WHERE id = $1', id);
  }

  async getUserByEmail(email: string) {
    return await this.getAtLeastOne(
      'SELECT * FROM users WHERE email = $1',
      email,
    );
  }

  async getUserByUsername(username: string) {
    return await this.getAtLeastOne(
      'SELECT * FROM users WHERE username = $1',
      username,
    );
  }

  async updateUser(userId: number, username?: string, password?: string) {
    if (username) {
      await this.updateAtLeastOne(
        'UPDATE users SET username = $1 WHERE id = $2',
        [username, userId],
      );
    }
    if (password) {
      const passwordHash = await this.createPasswordHash(password);
      await this.updateAtLeastOne(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, userId],
      );
    }
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
}
