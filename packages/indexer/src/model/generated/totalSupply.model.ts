import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_, OneToOne as OneToOne_, JoinColumn as JoinColumn_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"
import {DigitalAsset} from "./digitalAsset.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class TotalSupply {
    constructor(props?: Partial<TotalSupply>) {
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
    address!: string

    @Index_({unique: true})
    @OneToOne_(() => DigitalAsset, {nullable: true})
    @JoinColumn_()
    digitalAsset!: DigitalAsset

    @Index_()
    @BigIntColumn_({nullable: false})
    value!: bigint
}
