import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_, OneToOne as OneToOne_, JoinColumn as JoinColumn_} from "@subsquid/typeorm-store"
import {DigitalAsset} from "./digitalAsset.model"
import {NFT} from "./nft.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class OrbCooldownExpiry {
    constructor(props?: Partial<OrbCooldownExpiry>) {
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

    @Index_()
    @ManyToOne_(() => DigitalAsset, {nullable: true})
    digitalAsset!: DigitalAsset

    @Index_()
    @StringColumn_({nullable: false})
    tokenId!: string

    @Index_({unique: true})
    @OneToOne_(() => NFT, {nullable: true})
    @JoinColumn_()
    nft!: NFT

    @IntColumn_({nullable: false})
    value!: number
}
