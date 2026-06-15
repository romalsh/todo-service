import { ApiProperty } from '@nestjs/swagger';

export class PaginatedDto<T> {
	items!: T[];

	@ApiProperty({ example: 42 })
	total!: number;

	@ApiProperty({ example: 1 })
	page!: number;

	@ApiProperty({ example: 20 })
	limit!: number;

	constructor(items: T[], total: number, page: number, limit: number) {
		this.items = items;
		this.total = total;
		this.page = page;
		this.limit = limit;
	}
}
