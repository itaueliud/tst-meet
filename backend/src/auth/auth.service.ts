import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class AuthService {
  constructor(
    private adminService: AdminService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const admin = await this.adminService.findByEmail(normalizedEmail);
    if (!admin) throw new UnauthorizedException('Invalid credentials');
    const valid = await this.adminService.validatePassword(normalizedPassword, admin.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: admin.id, email: admin.email, role: 'admin' };
    return {
      access_token: this.jwtService.sign(payload),
      admin: { id: admin.id, email: admin.email, name: admin.name },
    };
  }
}
