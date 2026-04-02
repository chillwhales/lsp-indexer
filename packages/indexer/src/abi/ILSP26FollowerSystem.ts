import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    Follow: event("0xbccc71dc7842b86291138666aa18e133ee6d41aa71e6d7c650debad1a0576635", "Follow(address,address)", {"follower": p.address, "addr": p.address}),
    Unfollow: event("0x083700fd0d85112c9d8c5823585c7542e8fadb693c9902e5bc590ab367f7a15e", "Unfollow(address,address)", {"unfollower": p.address, "addr": p.address}),
}

export const functions = {
    follow: fun("0x4dbf27cc", "follow(address)", {"addr": p.address}, ),
    followBatch: fun("0xcf8711c8", "followBatch(address[])", {"addresses": p.array(p.address)}, ),
    followerCount: viewFun("0x30b3a890", "followerCount(address)", {"addr": p.address}, p.uint256),
    followingCount: viewFun("0x64548707", "followingCount(address)", {"addr": p.address}, p.uint256),
    getFollowersByIndex: viewFun("0xb2a8d069", "getFollowersByIndex(address,uint256,uint256)", {"addr": p.address, "startIndex": p.uint256, "endIndex": p.uint256}, p.array(p.address)),
    getFollowsByIndex: viewFun("0x5a39c581", "getFollowsByIndex(address,uint256,uint256)", {"addr": p.address, "startIndex": p.uint256, "endIndex": p.uint256}, p.array(p.address)),
    isFollowing: viewFun("0x99ec3a42", "isFollowing(address,address)", {"follower": p.address, "addr": p.address}, p.bool),
    unfollow: fun("0x015a4ead", "unfollow(address)", {"addr": p.address}, ),
    unfollowBatch: fun("0x8dd1e47e", "unfollowBatch(address[])", {"addresses": p.array(p.address)}, ),
}

export class Contract extends ContractBase {

    followerCount(addr: FollowerCountParams["addr"]) {
        return this.eth_call(functions.followerCount, {addr})
    }

    followingCount(addr: FollowingCountParams["addr"]) {
        return this.eth_call(functions.followingCount, {addr})
    }

    getFollowersByIndex(addr: GetFollowersByIndexParams["addr"], startIndex: GetFollowersByIndexParams["startIndex"], endIndex: GetFollowersByIndexParams["endIndex"]) {
        return this.eth_call(functions.getFollowersByIndex, {addr, startIndex, endIndex})
    }

    getFollowsByIndex(addr: GetFollowsByIndexParams["addr"], startIndex: GetFollowsByIndexParams["startIndex"], endIndex: GetFollowsByIndexParams["endIndex"]) {
        return this.eth_call(functions.getFollowsByIndex, {addr, startIndex, endIndex})
    }

    isFollowing(follower: IsFollowingParams["follower"], addr: IsFollowingParams["addr"]) {
        return this.eth_call(functions.isFollowing, {follower, addr})
    }
}

/// Event types
export type FollowEventArgs = EParams<typeof events.Follow>
export type UnfollowEventArgs = EParams<typeof events.Unfollow>

/// Function types
export type FollowParams = FunctionArguments<typeof functions.follow>
export type FollowReturn = FunctionReturn<typeof functions.follow>

export type FollowBatchParams = FunctionArguments<typeof functions.followBatch>
export type FollowBatchReturn = FunctionReturn<typeof functions.followBatch>

export type FollowerCountParams = FunctionArguments<typeof functions.followerCount>
export type FollowerCountReturn = FunctionReturn<typeof functions.followerCount>

export type FollowingCountParams = FunctionArguments<typeof functions.followingCount>
export type FollowingCountReturn = FunctionReturn<typeof functions.followingCount>

export type GetFollowersByIndexParams = FunctionArguments<typeof functions.getFollowersByIndex>
export type GetFollowersByIndexReturn = FunctionReturn<typeof functions.getFollowersByIndex>

export type GetFollowsByIndexParams = FunctionArguments<typeof functions.getFollowsByIndex>
export type GetFollowsByIndexReturn = FunctionReturn<typeof functions.getFollowsByIndex>

export type IsFollowingParams = FunctionArguments<typeof functions.isFollowing>
export type IsFollowingReturn = FunctionReturn<typeof functions.isFollowing>

export type UnfollowParams = FunctionArguments<typeof functions.unfollow>
export type UnfollowReturn = FunctionReturn<typeof functions.unfollow>

export type UnfollowBatchParams = FunctionArguments<typeof functions.unfollowBatch>
export type UnfollowBatchReturn = FunctionReturn<typeof functions.unfollowBatch>

