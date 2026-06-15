import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedDto } from '../dto/paginated.dto';

export function ApiOkPaginated<TModel extends Type<unknown>>(model: TModel) {
	return applyDecorators(
		ApiExtraModels(PaginatedDto, model),
		ApiOkResponse({
			schema: {
				allOf: [
					{ $ref: getSchemaPath(PaginatedDto) },
					{
						properties: {
							items: {
								type: 'array',
								items: { $ref: getSchemaPath(model) },
							},
						},
					},
				],
			},
		}),
	);
}
