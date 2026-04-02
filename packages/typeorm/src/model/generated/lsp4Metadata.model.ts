import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, ManyToOne as ManyToOne_, OneToOne as OneToOne_, OneToMany as OneToMany_, BooleanColumn as BooleanColumn_} from "@subsquid/typeorm-store"
import {DigitalAsset} from "./digitalAsset.model"
import {NFT} from "./nft.model"
import {LSP4MetadataName} from "./lsp4MetadataName.model"
import {LSP4MetadataDescription} from "./lsp4MetadataDescription.model"
import {LSP4MetadataScore} from "./lsp4MetadataScore.model"
import {LSP4MetadataRank} from "./lsp4MetadataRank.model"
import {LSP4MetadataCategory} from "./lsp4MetadataCategory.model"
import {LSP4MetadataLink} from "./lsp4MetadataLink.model"
import {LSP4MetadataIcon} from "./lsp4MetadataIcon.model"
import {LSP4MetadataImage} from "./lsp4MetadataImage.model"
import {LSP4MetadataAsset} from "./lsp4MetadataAsset.model"
import {LSP4MetadataAttribute} from "./lsp4MetadataAttribute.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP4Metadata {
    constructor(props?: Partial<LSP4Metadata>) {
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
    @ManyToOne_(() => DigitalAsset, {nullable: true})
    digitalAsset!: DigitalAsset

    @Index_()
    @StringColumn_({nullable: true})
    tokenId!: string | undefined | null

    @Index_()
    @ManyToOne_(() => NFT, {nullable: true})
    nft!: NFT | undefined | null

    @OneToOne_(() => LSP4MetadataName, e => e.lsp4Metadata)
    name!: LSP4MetadataName | undefined | null

    @OneToOne_(() => LSP4MetadataDescription, e => e.lsp4Metadata)
    description!: LSP4MetadataDescription | undefined | null

    @OneToOne_(() => LSP4MetadataScore, e => e.lsp4Metadata)
    score!: LSP4MetadataScore | undefined | null

    @OneToOne_(() => LSP4MetadataRank, e => e.lsp4Metadata)
    rank!: LSP4MetadataRank | undefined | null

    @OneToOne_(() => LSP4MetadataCategory, e => e.lsp4Metadata)
    category!: LSP4MetadataCategory | undefined | null

    @OneToMany_(() => LSP4MetadataLink, e => e.lsp4Metadata)
    links!: LSP4MetadataLink[]

    @OneToMany_(() => LSP4MetadataIcon, e => e.lsp4Metadata)
    icon!: LSP4MetadataIcon[]

    @OneToMany_(() => LSP4MetadataImage, e => e.lsp4Metadata)
    images!: LSP4MetadataImage[]

    @OneToMany_(() => LSP4MetadataAsset, e => e.lsp4Metadata)
    assets!: LSP4MetadataAsset[]

    @OneToMany_(() => LSP4MetadataAttribute, e => e.lsp4Metadata)
    attributes!: LSP4MetadataAttribute[]

    @StringColumn_({nullable: true})
    url!: string | undefined | null

    @StringColumn_({nullable: false})
    rawValue!: string

    @StringColumn_({nullable: true})
    decodeError!: string | undefined | null

    @BooleanColumn_({nullable: false})
    isDataFetched!: boolean

    @StringColumn_({nullable: true})
    fetchErrorMessage!: string | undefined | null

    @StringColumn_({nullable: true})
    fetchErrorCode!: string | undefined | null

    @IntColumn_({nullable: true})
    fetchErrorStatus!: number | undefined | null

    @IntColumn_({nullable: true})
    retryCount!: number | undefined | null
}
