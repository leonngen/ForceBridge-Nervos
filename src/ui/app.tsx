/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { CONFIG } from '../config';
import { SupplyChainWrapper } from '../lib/contracts/SupplyChainWrapper';
import { AddressTranslator, BridgeRPCHandler } from 'nervos-godwoken-integration';
import * as CompiledContractArtifact from '../../build/contracts/ERC20.json';



interface product {
    name: string;
    category: string;
    proc: string;
    0: string;
    1: string;
    2: string;
}


async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            toast.error('You rejected to connect metamask');
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<SupplyChainWrapper>();   
    const [accounts, setAccounts] = useState<string[]>(); 
    const [balance, setBalance] = useState<bigint>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [depositAddress, setDepositAddress] = useState<string>('');
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [balanceOf, setBalanceOf] = useState<bigint>();
    const [storedValue, setStoredValue] = useState<number | undefined>();
    const [product, setProduct] = useState<product>();
    const [productId, setProductId] = useState<number | undefined>();
    const [process, setProcess] = useState<string | undefined>();
    const [productName, setProductName] = useState<string | undefined>();
    const [productStatus, setProductStatus] = useState<string | undefined>();
    const [productCategory, setProductCategory] = useState<string | undefined>();
    const [productCount, setProductCount] = useState<number>(0);
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const [productLoading, setProductLoading] = useState<boolean>(false);
    const toastId = React.useRef(null);
    const [newStoredNumberInputValue, setNewStoredNumberInputValue] = useState<
        number | undefined
    >();
    
    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new SupplyChainWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);
            setDeployTxHash(transactionHash);

            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed!',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new SupplyChainWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setStoredValue(undefined);
    }

    async function setNewProduct() {
        try {
            setTransactionInProgress(true);
            await contract.createProduct(productName,productCategory,account); 
            toast(
                'Successfully created a new product.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
            setProductName('');
            setProductCategory('');
            setProductCount(p => p + 1);
        }
    }

    async function addNewProcess() {
        try {
            setTransactionInProgress(true);
            await contract.addProcess(productId,productStatus,account)
            toast(
                'Successfully updated the shipping process.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
            setProductStatus('');
        }
    }

    async function getProduct() {
        setProductLoading(true);

        const value = await contract.getProduct(productId,account);
        toast('Successfully read product informations.', { type: 'success' });
        setProduct(value);

        setProductLoading(false);
}

const SUDT_PROXY_CONTRACT_ADDRESS = '0x077aB85D2559df7ae7d4F5EF2455dD8F58ab1de6';

const getSUDTTokenBalance = async () => {
    const contract = new web3.eth.Contract(
        CompiledContractArtifact.abi as any,
        SUDT_PROXY_CONTRACT_ADDRESS
    );

    const _balanceOf = await contract.methods.balanceOf(polyjuiceAddress).call({
        from: accounts?.[0]
    });
    console.log('BALANCE::', _balanceOf);
    setBalanceOf(_balanceOf);
};

const layer2DepositAddress = async () => {
    setProductLoading(true);
    const addressTranslator = new AddressTranslator();
    const _depositAddress = await addressTranslator.getLayer2DepositAddress(
        web3,
        accounts?.[0]
    );

    console.log(`Layer 2 Deposit Address on Layer 1: \n${_depositAddress.addressString}`);

    setDepositAddress(_depositAddress.addressString);

    getSUDTTokenBalance();
    setProductLoading(false);
};

console.log(`Polyjuice Address: ${polyjuiceAddress}\n`);
const FORCE_BRIDGE = 'https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos?xchain-asset=0x0000000000000000000000000000000000000000';

const openForceBridge = () => {
    window.location.href = FORCE_BRIDGE;
};

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setBalance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
             Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            <hr />
            Balance: <b>{balance ? (balance / 10n ** 8n).toString() : <LoadingIndicator />} ETH</b>
            <br />
            <br />
            <hr />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br />
            <hr />
            <p>
                The button below will deploy a SupplyChain smart contract where you can add a new product and control the supply processes.
            </p>
            <button onClick={deployContract} disabled={!balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <input
                type="string"
                placeholder="Product Name"
                onChange={e => setProductName(e.target.value)}
            />
            <input
                type="string"
                placeholder="Product Category"
                onChange={e => setProductCategory(e.target.value)}
            />
            <button onClick={setNewProduct} disabled={!contract}>
                Add Product
            </button>
            <br /><br /><br />
            <input
                type="number"
                placeholder="Product ID"
                onChange={e => setProductId(parseInt(e.target.value,10))}
            />
            <input
                type="string"
                placeholder="Product Status"
                onChange={e => setProductStatus(e.target.value)}
            />
            <button onClick={addNewProcess} disabled={!contract}>
                Add Process
            </button>
            <br /><br /><br />
            <input
                type="number"
                placeholder="Product ID"
                onChange={e => setProductId(parseInt(e.target.value,10))}
            />
            <button onClick={getProduct} disabled={!contract}>
                Get Product
            </button>
            <br /><br />
            <div>
                    {productLoading ? (
                        <LoadingIndicator />
                    ) : (
                        product?.[1].length > 0 && (
                            <div>
                                <div>
                                    <p>
                                        Product Name: <strong>{product.name}</strong>
                                    </p>
                                </div>
                                <div>
                                    <p>
                                        Product Category: <strong>{product.category}</strong>
                                    </p>
                                </div>
                                <div>
                                    <p>
                                        Product Status: <strong>{product.proc}/5</strong>
                                    </p>
                                </div>
                            </div>
                        )
                    )}
                </div>

                <br /><br /><br />
                <hr />
                <p>
                <strong>The button below will show the receiver address for force-bridge task.</strong>
                 </p>
                 <div>
                {!depositAddress && (
                    <button onClick={layer2DepositAddress}>
                        <strong>Show L2 Deposit Address and Balance</strong>
                    </button>
                )}

                {productLoading && <LoadingIndicator />}
                {!productLoading && depositAddress && (
                    <div>
                        <div>
                            {' '}
                            <strong>User's Layer 2 Balance:</strong> {balanceOf}
                            <h4>L2 Deposit Address </h4>
                            <div className="receiverColor">
                            {depositAddress}
                            </div>
                        </div>
                         <br/>
                        <div>
                            <div>
                                Copy your Layer 2 deposit receiver address and click the below button.{' '}
                            </div>
                            <br/>
                            <div>
                                <button onClick={openForceBridge}>Click</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <br />
            <br />
            <ToastContainer /> 
        </div>
    );
}
