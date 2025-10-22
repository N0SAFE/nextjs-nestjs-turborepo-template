import { Module } from "@nestjs/common";
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { UserController } from './controllers/user.controller';
import { DatabaseModule } from '../../core/modules/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [UserController],
    providers: [UserService, UserRepository],
    exports: [UserService, UserRepository],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserModule {}