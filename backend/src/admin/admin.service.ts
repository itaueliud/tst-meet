import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    const email = process.env.ADMIN_EMAIL || 'admin@tst-meet.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const existing = await this.adminRepo.findOne({ where: { email } });
    if (!existing) {
      const hashed = await bcrypt.hash(password, 10);
      await this.adminRepo.save({ email, password: hashed, name: 'Super Admin' });
      this.logger.log(`✅ Admin seeded: ${email}`);
    }
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return this.adminRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<Admin | null> {
    return this.adminRepo.findOne({ where: { id } });
  }

  async validatePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
