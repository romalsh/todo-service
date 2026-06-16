import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
	ApiCreatedResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiErrorResponses, ErrorCode } from '@libs/common';
import { AuthService } from './auth.service';
import { AuthTokenDto } from './dto/auth-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const AUTH_THROTTLE_TTL_SECONDS = Number(process.env.THROTTLE_AUTH_TTL ?? 60);
const AUTH_THROTTLE_LIMIT = Number(process.env.THROTTLE_AUTH_LIMIT ?? 10);

@ApiTags('auth')
@Throttle({
	default: { ttl: AUTH_THROTTLE_TTL_SECONDS * 1000, limit: AUTH_THROTTLE_LIMIT },
})
@Controller('auth')
export class AuthController {
	constructor(private readonly auth: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: 'Register a new user and receive an access token' })
	@ApiCreatedResponse({ type: AuthTokenDto })
	@ApiErrorResponses(ErrorCode.VALIDATION_ERROR, ErrorCode.EMAIL_TAKEN)
	register(@Body() dto: RegisterDto): Promise<AuthTokenDto> {
		return this.auth.register(dto.email, dto.password);
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Authenticate and receive an access token' })
	@ApiOkResponse({ type: AuthTokenDto })
	@ApiErrorResponses(ErrorCode.VALIDATION_ERROR, ErrorCode.INVALID_CREDENTIALS)
	login(@Body() dto: LoginDto): Promise<AuthTokenDto> {
		return this.auth.login(dto.email, dto.password);
	}
}
