import { Injectable } from '@nestjs/common';

@Injectable()
export class StringsService {
    removeLastWhiteSpaces(dir: string | undefined): string {
        if (dir === undefined) {
            return dir;
        }
        
        let newDir = dir;

        while(newDir.endsWith(' ')) {
            newDir = newDir.slice(0, -1);
        }

        return newDir;
    }

    separateDate(date: string) {
        const dateArray = date.split("-");

        return {
            day: parseInt(dateArray[0]),
            month: parseInt(dateArray[1]),
            year: parseInt(dateArray[2]),
        }
    }

    separateDateNoDash(fecha: string) {
        const date = fecha.toString();
        const dateArray = date.split("");
        const year = [...dateArray.slice(0, 4)];
        const month = [...dateArray.slice(4, 6)];
        const day = [...dateArray.slice(6, 8)];

        return { year, month, day }
    }
}
