import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, OneToOne as OneToOne_, JoinColumn as JoinColumn_, StringColumn as StringColumn_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"
import {LSP29EncryptedAsset} from "./lsp29EncryptedAsset.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP29EncryptedAssetChunks {
    constructor(props?: Partial<LSP29EncryptedAssetChunks>) {
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

    @Index_({unique: true})
    @OneToOne_(() => LSP29EncryptedAsset, {nullable: true})
    @JoinColumn_()
    lsp29EncryptedAsset!: LSP29EncryptedAsset

    @StringColumn_({nullable: true})
    iv!: string | undefined | null

    @BigIntColumn_({nullable: true})
    totalSize!: bigint | undefined | null

    @StringColumn_({array: true, nullable: true})
    ipfsCids!: (string)[] | undefined | null

    @StringColumn_({array: true, nullable: true})
    lumeraActionIds!: (string)[] | undefined | null

    @StringColumn_({array: true, nullable: true})
    arweaveTransactionIds!: (string)[] | undefined | null

    @StringColumn_({array: true, nullable: true})
    s3Keys!: (string)[] | undefined | null

    @StringColumn_({nullable: true})
    s3Bucket!: string | undefined | null

    @StringColumn_({nullable: true})
    s3Region!: string | undefined | null
}
