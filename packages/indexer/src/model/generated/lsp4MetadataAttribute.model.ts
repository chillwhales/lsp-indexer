import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, ManyToOne as ManyToOne_, StringColumn as StringColumn_, FloatColumn as FloatColumn_} from "@subsquid/typeorm-store"
import {LSP4Metadata} from "./lsp4Metadata.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP4MetadataAttribute {
    constructor(props?: Partial<LSP4MetadataAttribute>) {
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
    @ManyToOne_(() => LSP4Metadata, {nullable: true})
    lsp4Metadata!: LSP4Metadata

    @Index_()
    @StringColumn_({nullable: true})
    key!: string | undefined | null

    @Index_()
    @StringColumn_({nullable: true})
    value!: string | undefined | null

    @Index_()
    @StringColumn_({nullable: true})
    type!: string | undefined | null

    @Index_()
    @FloatColumn_({nullable: true})
    score!: number | undefined | null

    @Index_()
    @FloatColumn_({nullable: true})
    rarity!: number | undefined | null
}
