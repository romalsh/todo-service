import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly users: Repository<UserEntity>,
	) {}

	create(email: string, passwordHash: string): Promise<UserEntity> {
		const user = this.users.create({ email, passwordHash });
		return this.users.save(user);
	}

	findByEmail(email: string): Promise<UserEntity | null> {
		return this.users.findOne({ where: { email } });
	}

	findById(id: string): Promise<UserEntity | null> {
		return this.users.findOne({ where: { id } });
	}
}
