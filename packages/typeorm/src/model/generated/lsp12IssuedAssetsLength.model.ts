import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, OneToOne as OneToOne_, JoinColumn as JoinColumn_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"
import {UniversalProfile} from "./universalProfile.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP12IssuedAssetsLength {
    constructor(props?: Partial<LSP12IssuedAssetsLength>) {
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

    @Index_({unique: true})
    @OneToOne_(() => UniversalProfile, {nullable: true})
    @JoinColumn_()
    universalProfile!: UniversalProfile

    @Index_()
    @BigIntColumn_({nullable: true})
    value!: bigint | undefined | null

    @StringColumn_({nullable: false})
    rawValue!: string
}
