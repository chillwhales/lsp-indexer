import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_, BigIntColumn as BigIntColumn_, OneToOne as OneToOne_, OneToMany as OneToMany_, BooleanColumn as BooleanColumn_} from "@subsquid/typeorm-store"
import {UniversalProfile} from "./universalProfile.model"
import {LSP29EncryptedAssetTitle} from "./lsp29EncryptedAssetTitle.model"
import {LSP29EncryptedAssetDescription} from "./lsp29EncryptedAssetDescription.model"
import {LSP29EncryptedAssetFile} from "./lsp29EncryptedAssetFile.model"
import {LSP29EncryptedAssetEncryption} from "./lsp29EncryptedAssetEncryption.model"
import {LSP29EncryptedAssetChunks} from "./lsp29EncryptedAssetChunks.model"
import {LSP29EncryptedAssetImage} from "./lsp29EncryptedAssetImage.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP29EncryptedAsset {
    constructor(props?: Partial<LSP29EncryptedAsset>) {
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

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    universalProfile!: UniversalProfile

    @Index_()
    @StringColumn_({nullable: true})
    contentId!: string | undefined | null

    @Index_()
    @IntColumn_({nullable: true})
    revision!: number | undefined | null

    @Index_()
    @BigIntColumn_({nullable: true})
    arrayIndex!: bigint | undefined | null

    @StringColumn_({nullable: true})
    version!: string | undefined | null

    @OneToOne_(() => LSP29EncryptedAssetTitle, e => e.lsp29EncryptedAsset)
    title!: LSP29EncryptedAssetTitle | undefined | null

    @OneToOne_(() => LSP29EncryptedAssetDescription, e => e.lsp29EncryptedAsset)
    description!: LSP29EncryptedAssetDescription | undefined | null

    @OneToOne_(() => LSP29EncryptedAssetFile, e => e.lsp29EncryptedAsset)
    file!: LSP29EncryptedAssetFile | undefined | null

    @OneToOne_(() => LSP29EncryptedAssetEncryption, e => e.lsp29EncryptedAsset)
    encryption!: LSP29EncryptedAssetEncryption | undefined | null

    @OneToOne_(() => LSP29EncryptedAssetChunks, e => e.lsp29EncryptedAsset)
    chunks!: LSP29EncryptedAssetChunks | undefined | null

    @OneToMany_(() => LSP29EncryptedAssetImage, e => e.lsp29EncryptedAsset)
    images!: LSP29EncryptedAssetImage[]

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
