import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, ManyToOne as ManyToOne_, BigIntColumn as BigIntColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {UniversalProfile} from "./universalProfile.model"
import {LSP6Permission} from "./lsp6Permission.model"
import {LSP6AllowedCall} from "./lsp6AllowedCall.model"
import {LSP6AllowedERC725YDataKey} from "./lsp6AllowedErc725YDataKey.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP6Controller {
    constructor(props?: Partial<LSP6Controller>) {
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
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    universalProfile!: UniversalProfile

    @Index_()
    @StringColumn_({nullable: false})
    controllerAddress!: string

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    controllerProfile!: UniversalProfile | undefined | null

    @Index_()
    @BigIntColumn_({nullable: true})
    arrayIndex!: bigint | undefined | null

    @OneToMany_(() => LSP6Permission, e => e.controller)
    permissions!: LSP6Permission[]

    @StringColumn_({nullable: true})
    permissionsRawValue!: string | undefined | null

    @OneToMany_(() => LSP6AllowedCall, e => e.controller)
    allowedCalls!: LSP6AllowedCall[]

    @StringColumn_({nullable: true})
    allowedCallsRawValue!: string | undefined | null

    @OneToMany_(() => LSP6AllowedERC725YDataKey, e => e.controller)
    allowedDataKeys!: LSP6AllowedERC725YDataKey[]

    @StringColumn_({nullable: true})
    allowedDataKeysRawValue!: string | undefined | null
}
