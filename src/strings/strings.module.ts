import { Module } from '@nestjs/common';

import { StringsService } from './strings.service';

@Module({
    controllers: [],
    providers: [StringsService],
    exports: [StringsService],
})
export class StringsModule {}
