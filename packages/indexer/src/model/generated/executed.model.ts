import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, BigIntColumn as BigIntColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {OperationType} from "./_operationType"
import {UniversalProfile} from "./universalProfile.model"
import {DigitalAsset} from "./digitalAsset.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class Executed {
    constructor(props?: Partial<Executed>) {
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
    logIndex!: number

    @Index_()
    @IntColumn_({nullable: false})
    transactionIndex!: number

    @Index_()
    @StringColumn_({nullable: false})
    address!: string

    @Index_()
    @Column_("varchar", {length: 12, nullable: false})
    decodedOperationType!: OperationType

    @Index_()
    @BigIntColumn_({nullable: false})
    operationType!: bigint

    @Index_()
    @BigIntColumn_({nullable: false})
    value!: bigint

    @Index_()
    @StringColumn_({nullable: false})
    target!: string

    @Index_()
    @StringColumn_({nullable: false})
    selector!: string

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    targetProfile!: UniversalProfile | undefined | null

    @Index_()
    @ManyToOne_(() => DigitalAsset, {nullable: true})
    targetAsset!: DigitalAsset | undefined | null

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    universalProfile!: UniversalProfile | undefined | null
}
