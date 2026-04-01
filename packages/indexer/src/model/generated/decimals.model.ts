import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, OneToOne as OneToOne_, JoinColumn as JoinColumn_} from "@subsquid/typeorm-store"
import {DigitalAsset} from "./digitalAsset.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class Decimals {
    constructor(props?: Partial<Decimals>) {
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

    @Index_({unique: true})
    @OneToOne_(() => DigitalAsset, {nullable: true})
    @JoinColumn_()
    digitalAsset!: DigitalAsset

    @Index_()
    @IntColumn_({nullable: false})
    value!: number
}
