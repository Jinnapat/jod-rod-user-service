import { Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

export type User = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
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
    console.log(password);
    const passwordHash = await this.createPasswordHash(password);
    console.log(passwordHash);
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

  async getUserByUsername(username: string) {
    return await this.getAtLeastOne(
      'SELECT * FROM users WHERE username = $1',
      username,
    );
  }

  async updateUser(userId: number, username?: string, password?: string) {
    let query = '';
    if (username) {
      query += 'username = $1';
    }
    if (password) {
      query += 'password = $2';
    }
    const client = await this.pool.connect();
    const res = await client.query(
      'UPDATE users SET ' + query + ' WHERE id = $3',
      [username, password, userId],
    );
    client.release();
    if (res.rows.length == 0) throw new NotFoundException('No user found');
  }

  private async createPasswordHash(password: string) {
    return await bcrypt.hash(
      password,
      parseInt(this.configService.get('PASSWORD_SALT')),
    );
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
