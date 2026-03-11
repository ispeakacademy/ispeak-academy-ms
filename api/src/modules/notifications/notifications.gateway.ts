import authConfig from '@/config/auth.config';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
	cors: {
		origin: '*',
	},
	namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(NotificationsGateway.name);

	constructor(private readonly jwtService: JwtService) {}

	async handleConnection(client: Socket) {
		try {
			const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
			if (!token) {
				this.logger.warn(`Client ${client.id} connected without token — disconnecting`);
				client.disconnect();
				return;
			}

			const payload = this.jwtService.verify(token, { secret: authConfig.jwtSecret });
			const userId = payload.sub;

			if (!userId) {
				client.disconnect();
				return;
			}

			// Join user-specific room
			client.join(`user:${userId}`);
			client.data.userId = userId;
			this.logger.log(`Client ${client.id} connected and joined room user:${userId}`);
		} catch (error) {
			this.logger.warn(`Client ${client.id} failed authentication: ${error.message}`);
			client.disconnect();
		}
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client ${client.id} disconnected`);
	}

	sendToUser(userId: string, event: string, data: any) {
		this.server.to(`user:${userId}`).emit(event, data);
	}
}
