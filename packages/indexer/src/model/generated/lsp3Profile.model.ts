import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_, OneToOne as OneToOne_, OneToMany as OneToMany_, BooleanColumn as BooleanColumn_} from "@subsquid/typeorm-store"
import {UniversalProfile} from "./universalProfile.model"
import {LSP3ProfileName} from "./lsp3ProfileName.model"
import {LSP3ProfileDescription} from "./lsp3ProfileDescription.model"
import {LSP3ProfileTag} from "./lsp3ProfileTag.model"
import {LSP3ProfileLink} from "./lsp3ProfileLink.model"
import {LSP3ProfileAsset} from "./lsp3ProfileAsset.model"
import {LSP3ProfileImage} from "./lsp3ProfileImage.model"
import {LSP3ProfileBackgroundImage} from "./lsp3ProfileBackgroundImage.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP3Profile {
    constructor(props?: Partial<LSP3Profile>) {
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

    @OneToOne_(() => LSP3ProfileName, e => e.lsp3Profile)
    name!: LSP3ProfileName | undefined | null

    @OneToOne_(() => LSP3ProfileDescription, e => e.lsp3Profile)
    description!: LSP3ProfileDescription | undefined | null

    @OneToMany_(() => LSP3ProfileTag, e => e.lsp3Profile)
    tags!: LSP3ProfileTag[]

    @OneToMany_(() => LSP3ProfileLink, e => e.lsp3Profile)
    links!: LSP3ProfileLink[]

    @OneToMany_(() => LSP3ProfileAsset, e => e.lsp3Profile)
    avatar!: LSP3ProfileAsset[]

    @OneToMany_(() => LSP3ProfileImage, e => e.lsp3Profile)
    profileImage!: LSP3ProfileImage[]

    @OneToMany_(() => LSP3ProfileBackgroundImage, e => e.lsp3Profile)
    backgroundImage!: LSP3ProfileBackgroundImage[]

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
