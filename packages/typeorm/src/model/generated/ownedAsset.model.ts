import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, BigIntColumn as BigIntColumn_, ManyToOne as ManyToOne_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {DigitalAsset} from "./digitalAsset.model"
import {UniversalProfile} from "./universalProfile.model"
import {OwnedToken} from "./ownedToken.model"

@Index_(["address", "owner"], {unique: false})
@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class OwnedAsset {
    constructor(props?: Partial<OwnedAsset>) {
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
    @BigIntColumn_({nullable: false})
    balance!: bigint

    @StringColumn_({nullable: false})
    address!: string

    @Index_()
    @StringColumn_({nullable: false})
    owner!: string

    @Index_()
    @ManyToOne_(() => DigitalAsset, {nullable: true})
    digitalAsset!: DigitalAsset | undefined | null

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    universalProfile!: UniversalProfile | undefined | null

    @OneToMany_(() => OwnedToken, e => e.ownedAsset)
    tokenIds!: OwnedToken[]
}
