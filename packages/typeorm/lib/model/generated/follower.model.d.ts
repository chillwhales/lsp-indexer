import { UniversalProfile } from "./universalProfile.model";
export declare class Follower {
    constructor(props?: Partial<Follower>);
    id: string;
    timestamp: Date;
    blockNumber: number;
    logIndex: number;
    transactionIndex: number;
    address: string;
    followerAddress: string;
    followedAddress: string;
    followerUniversalProfile: UniversalProfile;
    followedUniversalProfile: UniversalProfile;
}
