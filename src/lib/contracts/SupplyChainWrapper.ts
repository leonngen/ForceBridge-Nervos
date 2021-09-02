import Web3 from 'web3';
import * as SupplyChainJSON from '../../../build/contracts/SupplyChain.json';
import { SupplyChain } from '../../types/SupplyChain';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class SupplyChainWrapper {
    web3: Web3;

    contract: SupplyChain;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(SupplyChainJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async createProduct(name: string,category:string, fromAddress: string) {
        const tx = await this.contract.methods
        .setProduct(name,category)
        .send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async addProcess(id:number,status: string, fromAddress: string) {
        const tx = await this.contract.methods
        .addProcess(id,status)
        .send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async getProduct(id:number,fromAddress: string) {
        const data = await this.contract.methods
        .productInfo(id)
        .call({ from: fromAddress });

        return data;
    }

    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: SupplyChainJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
