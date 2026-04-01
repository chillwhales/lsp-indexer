import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, OneToOne as OneToOne_, OneToMany as OneToMany_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {DigitalAssetOwner} from "./digitalAssetOwner.model"
import {TotalSupply} from "./totalSupply.model"
import {OwnedAsset} from "./ownedAsset.model"
import {OwnedToken} from "./ownedToken.model"
import {LSP4Metadata} from "./lsp4Metadata.model"
import {LSP4TokenName} from "./lsp4TokenName.model"
import {LSP4TokenSymbol} from "./lsp4TokenSymbol.model"
import {LSP4TokenType} from "./lsp4TokenType.model"
import {LSP4CreatorsLength} from "./lsp4CreatorsLength.model"
import {LSP4Creator} from "./lsp4Creator.model"
import {LSP5ReceivedAsset} from "./lsp5ReceivedAsset.model"
import {LSP12IssuedAsset} from "./lsp12IssuedAsset.model"
import {Decimals} from "./decimals.model"
import {LSP8TokenIdFormat} from "./lsp8TokenIdFormat.model"
import {LSP8ReferenceContract} from "./lsp8ReferenceContract.model"
import {LSP8TokenMetadataBaseURI} from "./lsp8TokenMetadataBaseUri.model"
import {NFT} from "./nft.model"
import {DataChanged} from "./dataChanged.model"
import {TokenIdDataChanged} from "./tokenIdDataChanged.model"
import {Transfer} from "./transfer.model"
import {OwnershipTransferred} from "./ownershipTransferred.model"
import {Executed} from "./executed.model"
import {UniversalReceiver} from "./universalReceiver.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class DigitalAsset {
    constructor(props?: Partial<DigitalAsset>) {
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
    address!: string

    @OneToOne_(() => DigitalAssetOwner, e => e.digitalAsset)
    owner!: DigitalAssetOwner | undefined | null

    @OneToOne_(() => TotalSupply, e => e.digitalAsset)
    totalSupply!: TotalSupply | undefined | null

    @OneToMany_(() => OwnedAsset, e => e.digitalAsset)
    ownedAssets!: OwnedAsset[]

    @OneToMany_(() => OwnedToken, e => e.digitalAsset)
    ownedTokens!: OwnedToken[]

    @Index_()
    @ManyToOne_(() => LSP4Metadata, {nullable: true})
    lsp4Metadata!: LSP4Metadata | undefined | null

    @OneToOne_(() => LSP4TokenName, e => e.digitalAsset)
    lsp4TokenName!: LSP4TokenName | undefined | null

    @OneToOne_(() => LSP4TokenSymbol, e => e.digitalAsset)
    lsp4TokenSymbol!: LSP4TokenSymbol | undefined | null

    @OneToOne_(() => LSP4TokenType, e => e.digitalAsset)
    lsp4TokenType!: LSP4TokenType | undefined | null

    @OneToOne_(() => LSP4CreatorsLength, e => e.digitalAsset)
    lsp4CreatorsLength!: LSP4CreatorsLength | undefined | null

    @OneToMany_(() => LSP4Creator, e => e.digitalAsset)
    lsp4Creators!: LSP4Creator[]

    @OneToMany_(() => LSP5ReceivedAsset, e => e.receivedAsset)
    lsp5ReceivedBy!: LSP5ReceivedAsset[]

    @OneToMany_(() => LSP12IssuedAsset, e => e.issuedAsset)
    lsp12IssuedBy!: LSP12IssuedAsset[]

    @OneToOne_(() => Decimals, e => e.digitalAsset)
    decimals!: Decimals | undefined | null

    @OneToOne_(() => LSP8TokenIdFormat, e => e.digitalAsset)
    lsp8TokenIdFormat!: LSP8TokenIdFormat | undefined | null

    @OneToOne_(() => LSP8ReferenceContract, e => e.digitalAsset)
    lsp8ReferenceContract!: LSP8ReferenceContract | undefined | null

    @OneToOne_(() => LSP8TokenMetadataBaseURI, e => e.digitalAsset)
    lsp8TokenMetadataBaseUri!: LSP8TokenMetadataBaseURI | undefined | null

    @OneToMany_(() => NFT, e => e.digitalAsset)
    nfts!: NFT[]

    @OneToMany_(() => DataChanged, e => e.digitalAsset)
    dataChanged!: DataChanged[]

    @OneToMany_(() => TokenIdDataChanged, e => e.digitalAsset)
    tokenIdDataChanged!: TokenIdDataChanged[]

    @OneToMany_(() => Transfer, e => e.digitalAsset)
    transfer!: Transfer[]

    @OneToMany_(() => OwnershipTransferred, e => e.digitalAsset)
    ownershipTransferred!: OwnershipTransferred[]

    @OneToMany_(() => Executed, e => e.targetAsset)
    executedTarget!: Executed[]

    @OneToMany_(() => UniversalReceiver, e => e.fromAsset)
    universalReceiverFrom!: UniversalReceiver[]
}
