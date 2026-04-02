import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, ManyToOne as ManyToOne_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"
import {UniversalProfile} from "./universalProfile.model"
import {DigitalAsset} from "./digitalAsset.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP5ReceivedAsset {
    constructor(props?: Partial<LSP5ReceivedAsset>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    network!: string

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
    address!: string

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    universalProfile!: UniversalProfile

    @Index_()
    @StringColumn_({nullable: false})
    assetAddress!: string

    @Index_()
    @ManyToOne_(() => DigitalAsset, {nullable: true})
    receivedAsset!: DigitalAsset | undefined | null

    @Index_()
    @BigIntColumn_({nullable: true})
    arrayIndex!: bigint | undefined | null

    @Index_()
    @StringColumn_({nullable: true})
    interfaceId!: string | undefined | null
}
