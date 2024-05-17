import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender } from '@ton/core';

export type CounterConfig = {};

export function counterConfigToCell(): Cell {
    return beginCell().endCell();
}

export class Counter implements Contract {
    
    static createForDeploy(code: Cell, initialCounterValue: number): Counter {
        const data = beginCell()
          .storeUint(initialCounterValue, 64)
          .endCell();
        const workchain = 0; // deploy to workchain 0
        const address = contractAddress(workchain, { code, data });
        return new Counter(address, { code, data });
    }

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Counter(address);
    }

    static createFromConfig(code: Cell, workchain = 0) {
        const data = counterConfigToCell();
        const init = { code, data };
        return new Counter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
          value: "0.01", // send 0.01 TON to contract for rent
          bounce: false
        });
    }

    async getCounter(provider: ContractProvider) {
        const { stack } = await provider.get("counter", []);
        return stack.readBigNumber();
    }

    async sendIncrement(provider: ContractProvider, via: Sender) {
        const messageBody = beginCell()
          .storeUint(1, 32) // op (op #1 = increment)
          .storeUint(0, 64) // query id
          .endCell();
        await provider.internal(via, {
          value: "0.002", // send 0.002 TON for gas
          body: messageBody
        });
    }
}
