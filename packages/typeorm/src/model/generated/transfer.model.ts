import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, BigIntColumn as BigIntColumn_, BooleanColumn as BooleanColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {UniversalProfile} from "./universalProfile.model"
import {DigitalAsset} from "./digitalAsset.model"
import {NFT} from "./nft.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class Transfer {
    constructor(props?: Partial<Transfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    network!: string

    @Index_()
    @DateTimeColumn_({nullable: false})
    timestamp!: Date

    @IntColumn_({nullable: false})
    blockNumber!: number

    @Index_()
    @IntColumn_({nullable: false})
    logIndex!: number

    @Index_()
    @IntColumn_({nullable: false})
    transactionIndex!: number

    @Index_()
    @StringColumn_({nullable: false})
    address!: string

    @Index_()
    @StringColumn_({nullable: false})
    operator!: string

    @Index_()
    @StringColumn_({nullable: false})
    from!: string

    @Index_()
    @StringColumn_({nullable: false})
    to!: string

    @Index_()
    @BigIntColumn_({nullable: false})
    amount!: bigint

    @Index_()
    @StringColumn_({nullable: true})
    tokenId!: string | undefined | null

    @Index_()
    @BooleanColumn_({nullable: false})
    force!: boolean

    @StringColumn_({nullable: false})
    data!: string

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    fromProfile!: UniversalProfile | undefined | null

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    toProfile!: UniversalProfile | undefined | null

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    operatorProfile!: UniversalProfile | undefined | null

    @Index_()
    @ManyToOne_(() => DigitalAsset, {nullable: true})
    digitalAsset!: DigitalAsset | undefined | null

    @Index_()
    @ManyToOne_(() => NFT, {nullable: true})
    nft!: NFT | undefined | null
}
