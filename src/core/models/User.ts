export class User {
    username!: string;
    displayName?: string;
    isActive: boolean = true;
    preferences!: {
        langauge: string,
        isSubscribed: boolean;
    }
    constructor(data: User){
        Object.assign(this, data);
    }
}