import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, OneToOne as OneToOne_, OneToMany as OneToMany_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {UniversalProfileOwner} from "./universalProfileOwner.model"
import {OwnedAsset} from "./ownedAsset.model"
import {OwnedToken} from "./ownedToken.model"
import {LSP3Profile} from "./lsp3Profile.model"
import {LSP5ReceivedAssetsLength} from "./lsp5ReceivedAssetsLength.model"
import {LSP5ReceivedAsset} from "./lsp5ReceivedAsset.model"
import {LSP6ControllersLength} from "./lsp6ControllersLength.model"
import {LSP6Controller} from "./lsp6Controller.model"
import {LSP12IssuedAssetsLength} from "./lsp12IssuedAssetsLength.model"
import {LSP12IssuedAsset} from "./lsp12IssuedAsset.model"
import {LSP4Creator} from "./lsp4Creator.model"
import {LSP29EncryptedAssetsLength} from "./lsp29EncryptedAssetsLength.model"
import {LSP29EncryptedAssetEntry} from "./lsp29EncryptedAssetEntry.model"
import {LSP29EncryptedAssetRevisionCount} from "./lsp29EncryptedAssetRevisionCount.model"
import {LSP29EncryptedAsset} from "./lsp29EncryptedAsset.model"
import {Executed} from "./executed.model"
import {DataChanged} from "./dataChanged.model"
import {OwnershipTransferred} from "./ownershipTransferred.model"
import {UniversalReceiver} from "./universalReceiver.model"
import {Follow} from "./follow.model"
import {Unfollow} from "./unfollow.model"
import {Transfer} from "./transfer.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class UniversalProfile {
    constructor(props?: Partial<UniversalProfile>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @DateTimeColumn_({nullable: false})
    timestamp!: Date

    @IntColumn_({nullable: false})
    blockNumber!: number

    @Index_()
    @IntColumn_({nullable: false})
    transactionIndex!: number

    @Index_()
    @IntColumn_({nullable: false})
    logIndex!: number

    @Index_()
    @StringColumn_({nullable: false})
    address!: string

    @OneToOne_(() => UniversalProfileOwner, e => e.universalProfile)
    owner!: UniversalProfileOwner | undefined | null

    @OneToMany_(() => OwnedAsset, e => e.universalProfile)
    ownedAssets!: OwnedAsset[]

    @OneToMany_(() => OwnedToken, e => e.universalProfile)
    ownedTokens!: OwnedToken[]

    @Index_()
    @ManyToOne_(() => LSP3Profile, {nullable: true})
    lsp3Profile!: LSP3Profile | undefined | null

    @OneToOne_(() => LSP5ReceivedAssetsLength, e => e.universalProfile)
    lsp5ReceivedAssetsLength!: LSP5ReceivedAssetsLength | undefined | null

    @OneToMany_(() => LSP5ReceivedAsset, e => e.universalProfile)
    lsp5ReceivedAssets!: LSP5ReceivedAsset[]

    @OneToOne_(() => LSP6ControllersLength, e => e.universalProfile)
    lsp6ControllersLength!: LSP6ControllersLength | undefined | null

    @OneToMany_(() => LSP6Controller, e => e.universalProfile)
    lsp6Controllers!: LSP6Controller[]

    @OneToOne_(() => LSP12IssuedAssetsLength, e => e.universalProfile)
    lsp12IssuedAssetsLength!: LSP12IssuedAssetsLength | undefined | null

    @OneToMany_(() => LSP12IssuedAsset, e => e.universalProfile)
    lsp12IssuedAssets!: LSP12IssuedAsset[]

    @OneToMany_(() => LSP4Creator, e => e.creatorProfile)
    lsp4CreatorOf!: LSP4Creator[]

    @OneToMany_(() => LSP6Controller, e => e.controllerProfile)
    lsp6ControllerOf!: LSP6Controller[]

    @OneToOne_(() => LSP29EncryptedAssetsLength, e => e.universalProfile)
    lsp29EncryptedAssetsLength!: LSP29EncryptedAssetsLength | undefined | null

    @OneToMany_(() => LSP29EncryptedAssetEntry, e => e.universalProfile)
    lsp29EncryptedAssetEntries!: LSP29EncryptedAssetEntry[]

    @OneToMany_(() => LSP29EncryptedAssetRevisionCount, e => e.universalProfile)
    lsp29EncryptedAssetRevisionCount!: LSP29EncryptedAssetRevisionCount[]

    @OneToMany_(() => LSP29EncryptedAsset, e => e.universalProfile)
    lsp29EncryptedAssets!: LSP29EncryptedAsset[]

    @OneToMany_(() => Executed, e => e.universalProfile)
    executed!: Executed[]

    @OneToMany_(() => DataChanged, e => e.universalProfile)
    dataChanged!: DataChanged[]

    @OneToMany_(() => OwnershipTransferred, e => e.universalProfile)
    ownershipTransferred!: OwnershipTransferred[]

    @OneToMany_(() => UniversalReceiver, e => e.universalProfile)
    universalReceiver!: UniversalReceiver[]

    @OneToMany_(() => Follow, e => e.followerUniversalProfile)
    followed!: Follow[]

    @OneToMany_(() => Follow, e => e.followedUniversalProfile)
    followedBy!: Follow[]

    @OneToMany_(() => Unfollow, e => e.followerUniversalProfile)
    unfollowed!: Unfollow[]

    @OneToMany_(() => Unfollow, e => e.unfollowedUniversalProfile)
    unfollowedBy!: Unfollow[]

    @OneToMany_(() => Transfer, e => e.fromProfile)
    outgoingTransfers!: Transfer[]

    @OneToMany_(() => Transfer, e => e.toProfile)
    incomingTransfers!: Transfer[]

    @OneToMany_(() => Transfer, e => e.operatorProfile)
    operatedTransfers!: Transfer[]

    @OneToMany_(() => OwnershipTransferred, e => e.previousOwnerProfile)
    transferredOwnership!: OwnershipTransferred[]

    @OneToMany_(() => OwnershipTransferred, e => e.newOwnerProfile)
    receivedOwnership!: OwnershipTransferred[]

    @OneToMany_(() => Executed, e => e.targetProfile)
    executedTarget!: Executed[]

    @OneToMany_(() => UniversalReceiver, e => e.fromProfile)
    universalReceiverFrom!: UniversalReceiver[]
}
