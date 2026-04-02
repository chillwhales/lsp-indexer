import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_, BooleanColumn as BooleanColumn_, OneToOne as OneToOne_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {DigitalAsset} from "./digitalAsset.model"
import {LSP4Metadata} from "./lsp4Metadata.model"
import {OwnedToken} from "./ownedToken.model"
import {ChillClaimed} from "./chillClaimed.model"
import {OrbsClaimed} from "./orbsClaimed.model"
import {OrbLevel} from "./orbLevel.model"
import {OrbCooldownExpiry} from "./orbCooldownExpiry.model"
import {OrbFaction} from "./orbFaction.model"
import {TokenIdDataChanged} from "./tokenIdDataChanged.model"
import {Transfer} from "./transfer.model"

@Index_(["tokenId", "digitalAsset"], {unique: false})
@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class NFT {
    constructor(props?: Partial<NFT>) {
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

    @StringColumn_({nullable: false})
    tokenId!: string

    @Index_()
    @StringColumn_({nullable: true})
    formattedTokenId!: string | undefined | null

    @Index_()
    @StringColumn_({nullable: false})
    address!: string

    @Index_()
    @ManyToOne_(() => DigitalAsset, {nullable: true})
    digitalAsset!: DigitalAsset | undefined | null

    @Index_()
    @ManyToOne_(() => LSP4Metadata, {nullable: true})
    lsp4Metadata!: LSP4Metadata | undefined | null

    @Index_()
    @ManyToOne_(() => LSP4Metadata, {nullable: true})
    lsp4MetadataBaseUri!: LSP4Metadata | undefined | null

    @Index_()
    @BooleanColumn_({nullable: false})
    isMinted!: boolean

    @Index_()
    @BooleanColumn_({nullable: false})
    isBurned!: boolean

    @OneToOne_(() => OwnedToken, e => e.nft)
    ownedToken!: OwnedToken | undefined | null

    @OneToOne_(() => ChillClaimed, e => e.nft)
    chillClaimed!: ChillClaimed | undefined | null

    @OneToOne_(() => OrbsClaimed, e => e.nft)
    orbsClaimed!: OrbsClaimed | undefined | null

    @OneToOne_(() => OrbLevel, e => e.nft)
    level!: OrbLevel | undefined | null

    @OneToOne_(() => OrbCooldownExpiry, e => e.nft)
    cooldownExpiry!: OrbCooldownExpiry | undefined | null

    @OneToOne_(() => OrbFaction, e => e.nft)
    faction!: OrbFaction | undefined | null

    @OneToMany_(() => TokenIdDataChanged, e => e.nft)
    tokenIdDataChanged!: TokenIdDataChanged[]

    @OneToMany_(() => Transfer, e => e.nft)
    transfer!: Transfer[]
}
