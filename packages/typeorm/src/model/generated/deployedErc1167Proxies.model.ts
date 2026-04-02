import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import * as marshal from "./marshal"
import {PrimaryContractDeploymentInit} from "./_primaryContractDeploymentInit"
import {SecondaryContractDeploymentInit} from "./_secondaryContractDeploymentInit"
import {UniversalProfile} from "./universalProfile.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class DeployedERC1167Proxies {
    constructor(props?: Partial<DeployedERC1167Proxies>) {
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
    logIndex!: number

    @Index_()
    @IntColumn_({nullable: false})
    transactionIndex!: number

    @Index_()
    @StringColumn_({nullable: false})
    address!: string

    @StringColumn_({nullable: false})
    primaryContract!: string

    @StringColumn_({nullable: false})
    secondaryContract!: string

    @Column_("jsonb", {transformer: {to: obj => obj.toJSON(), from: obj => obj == null ? undefined : new PrimaryContractDeploymentInit(undefined, obj)}, nullable: false})
    primaryContractDeploymentInit!: PrimaryContractDeploymentInit

    @Column_("jsonb", {transformer: {to: obj => obj.toJSON(), from: obj => obj == null ? undefined : new SecondaryContractDeploymentInit(undefined, obj)}, nullable: false})
    secondaryContractDeploymentInit!: SecondaryContractDeploymentInit

    @Index_()
    @StringColumn_({nullable: false})
    postDeploymentModule!: string

    @StringColumn_({nullable: false})
    postDeploymentModuleCalldata!: string

    @Index_()
    @ManyToOne_(() => UniversalProfile, {nullable: true})
    universalProfile!: UniversalProfile | undefined | null
}
