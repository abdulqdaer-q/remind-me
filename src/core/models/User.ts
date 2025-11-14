export interface Location {
    latitude: number;
    longitude: number;
}

export interface Functionalities {
    reminder: boolean;
    tracker: boolean;
    remindByCall: boolean;
}

export class User {
    username!: string;
    displayName?: string;
    isActive: boolean = true;
    preferences!: {
        language: string;
        isSubscribed: boolean;
    }
    location?: Location;
    functionalities?: Functionalities;

    constructor(data: User){
        Object.assign(this, data);
    }
}