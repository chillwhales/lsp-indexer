import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {LSP4Metadata} from "./lsp4Metadata.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP4MetadataLink {
    constructor(props?: Partial<LSP4MetadataLink>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    network!: string

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
    @ManyToOne_(() => LSP4Metadata, {nullable: true})
    lsp4Metadata!: LSP4Metadata

    @Index_()
    @StringColumn_({nullable: true})
    title!: string | undefined | null

    @Index_()
    @StringColumn_({nullable: true})
    url!: string | undefined | null
}
