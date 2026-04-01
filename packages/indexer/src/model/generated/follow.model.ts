import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {UniversalProfile} from "./universalProfile.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class Follow {
    constructor(props?: Partial<Follow>) {
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
    @StringColumn_({nullable: false})
    followerAddress!: string

    @Index_()
    @StringColumn_({nullable: false})
    followedAddress!: string

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    followerUniversalProfile!: UniversalProfile | undefined | null

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    followedUniversalProfile!: UniversalProfile | undefined | null
}
