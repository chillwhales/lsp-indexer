import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_, OneToOne as OneToOne_, JoinColumn as JoinColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {NFT} from "./nft.model"
import {DigitalAsset} from "./digitalAsset.model"
import {UniversalProfile} from "./universalProfile.model"
import {OwnedAsset} from "./ownedAsset.model"

@Index_(["address", "tokenId", "owner"], {unique: false})
@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class OwnedToken {
    constructor(props?: Partial<OwnedToken>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @IntColumn_({nullable: false})
    blockNumber!: number

    @Index_()
    @IntColumn_({nullable: false})
    transactionIndex!: number

    @Index_()
    @IntColumn_({nullable: false})
    logIndex!: number

    @Index_()
    @DateTimeColumn_({nullable: false})
    timestamp!: Date

    @Index_()
    @StringColumn_({nullable: false})
    tokenId!: string

    @StringColumn_({nullable: false})
    address!: string

    @Index_()
    @StringColumn_({nullable: false})
    owner!: string

    @Index_({unique: true})
    @OneToOne_(() => NFT, {nullable: true})
    @JoinColumn_()
    nft!: NFT | undefined | null

    @Index_()
    @ManyToOne_(() => DigitalAsset, {nullable: true})
    digitalAsset!: DigitalAsset | undefined | null

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    universalProfile!: UniversalProfile | undefined | null

    @Index_()
    @ManyToOne_(() => OwnedAsset, {nullable: true})
    ownedAsset!: OwnedAsset | undefined | null
}
