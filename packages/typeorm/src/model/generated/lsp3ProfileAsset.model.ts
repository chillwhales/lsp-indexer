import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {LSP3Profile} from "./lsp3Profile.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP3ProfileAsset {
    constructor(props?: Partial<LSP3ProfileAsset>) {
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
    @ManyToOne_(() => LSP3Profile, {nullable: true})
    lsp3Profile!: LSP3Profile

    @StringColumn_({nullable: true})
    url!: string | undefined | null

    @Index_()
    @StringColumn_({nullable: true})
    fileType!: string | undefined | null

    @StringColumn_({nullable: true})
    verificationMethod!: string | undefined | null

    @StringColumn_({nullable: true})
    verificationData!: string | undefined | null

    @StringColumn_({nullable: true})
    verificationSource!: string | undefined | null
}
