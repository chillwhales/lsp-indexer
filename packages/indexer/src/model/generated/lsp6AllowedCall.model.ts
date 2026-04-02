import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {LSP6Controller} from "./lsp6Controller.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP6AllowedCall {
    constructor(props?: Partial<LSP6AllowedCall>) {
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
    restrictionOperations!: string

    @Index_()
    @StringColumn_({nullable: false})
    allowedAddress!: string

    @Index_()
    @StringColumn_({nullable: false})
    allowedInterfaceId!: string

    @Index_()
    @StringColumn_({nullable: false})
    allowedFunction!: string

    @Index_()
    @ManyToOne_(() => LSP6Controller, {nullable: true})
    controller!: LSP6Controller | undefined | null
}
