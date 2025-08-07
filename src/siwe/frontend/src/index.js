import { BrowserProvider } from 'ethers';
import { SiweMessage }    from 'siwe';

const scheme = window.location.protocol.slice(0, -1);
const domain = window.location.host;
const origin = window.location.origin;
const provider = new BrowserProvider(window.ethereum);

const publicAddressElm   = document.getElementById('publicAddress');
const ensInfoElm         = document.getElementById('ensInfo');
const ensLoaderElm       = document.getElementById('ensLoader');
const ensProfileTableElm = document.getElementById('ensProfileTable');
const ensTableElm        = document.getElementById('ensTable');
const ensRawDataElm      = document.getElementById('ensRawData');

const nftElm         = document.getElementById('nft');
const nftLoaderElm   = document.getElementById('nftLoader');
const nftContainerEl = document.getElementById('nftContainer');
const nftTableElm    = document.getElementById('nftTable');

let address;
const BACKEND_ADDR = "http://localhost:3000";

async function createSiweMessage(address, statement) {
  const res = await fetch(`${BACKEND_ADDR}/nonce`, { credentials: 'include' });
  const message = new SiweMessage({
    scheme,
    domain,
    address,
    statement,
    uri: origin,
    version: '1',
    chainId: 1,
    nonce: await res.text()
  });
  return message.prepareMessage();
}

async function connectWallet() {
  try {
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    address = await signer.getAddress();

    publicAddressElm.textContent = `Connected: ${address}`;
    publicAddressElm.classList.remove('hidden');

    // as soon as we have an address, pull ENS & NFTs:
    await displayENSProfile();
    await displayNFTs();
  } catch {
    console.log('User rejected wallet request');
  }
}

async function displayENSProfile() {
  ensInfoElm.classList.add('hidden');
  ensProfileTableElm.classList.add('hidden');
  ensLoaderElm.textContent = 'Loading ENS…';

  const ensName = await provider.lookupAddress(address);
  if (!ensName) {
    ensLoaderElm.textContent = 'No ENS name found';
    ensInfoElm.classList.remove('hidden');
    ensRawDataElm.textContent = '{}';
    return;
  }

  // show profile table
  ensTableElm.innerHTML = `<tr><th>Key</th><th>Value</th></tr>`;
  const resolver = await provider.getResolver(ensName);
  const keys = ["name","email","url","description","com.twitter"];
  let raw = { ensName };

  // name
  ensTableElm.innerHTML += `<tr><td>name:</td><td>${ensName}</td></tr>`;

  for (const key of keys) {
    const val = await resolver.getText(key);
    ensTableElm.innerHTML += 
      `<tr><td>${key}:</td><td>${val||'—'}</td></tr>`;
    raw[key] = val;
  }

  // raw JSON dump
  ensRawDataElm.textContent = JSON.stringify(raw, null, 2);

  ensLoaderElm.textContent = '';
  ensProfileTableElm.classList.remove('hidden');
  ensInfoElm.classList.remove('hidden');
}

async function getNFTs() {
  try {
    const res = await fetch(
      `https://api.opensea.io/api/v1/assets?owner=${address}`
    );
    if (!res.ok) throw new Error(res.statusText);
    const body = await res.json();
    return (body.assets||[]).map(a=>({
      name:     a.name,
      address:  a.asset_contract.address,
      token_id: a.token_id
    }));
  } catch (err) {
    console.error(`Failed to resolve NFTs: ${err}`);
    return [];
  }
}

async function displayNFTs() {
  nftElm.classList.add('hidden');
  nftContainerEl.classList.add('hidden');
  nftLoaderElm.textContent = 'Loading NFTs…';

  const nfts = await getNFTs();
  if (!nfts.length) {
    nftLoaderElm.textContent = 'No NFTs found';
    nftElm.classList.remove('hidden');
    return;
  }

  let html = `<tr><th>Name</th><th>Contract</th><th>Token ID</th></tr>`;
  for (const nft of nfts) {
    html += `<tr>
      <td>${nft.name}</td>
      <td>${nft.address}</td>
      <td>${nft.token_id}</td>
    </tr>`;
  }
  nftTableElm.innerHTML = html;
  nftLoaderElm.textContent = '';
  nftContainerEl.classList.remove('hidden');
  nftElm.classList.remove('hidden');
}

async function signInWithEthereum() {
  const signer = await provider.getSigner();
  // hide old info
  ensInfoElm.classList.add('hidden');
  nftElm.classList.add('hidden');

  address = await signer.getAddress();
  publicAddressElm.textContent = `Authenticated: ${address}`;
  publicAddressElm.classList.remove('hidden');

  const message   = await createSiweMessage(address, 'SIWE to the app');
  const signature = await signer.signMessage(message);

  const res = await fetch(`${BACKEND_ADDR}/verify`, {
    method:      "POST",
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ message, signature }),
    credentials: 'include'
  });
  if (!res.ok) {
    console.error(`SIWE failed: ${res.statusText}`);
    return;
  }
  await res.text();

  // now re-fetch ENS & NFTs under the authenticated session
  await displayENSProfile();
  await displayNFTs();
}

async function getInformation() {
  const res = await fetch(`${BACKEND_ADDR}/personal_information`, {
    credentials: 'include',
  });
  if (!res.ok) {
    console.error(`Session-info failed: ${res.statusText}`);
    return;
  }
  const text = await res.text(); // "You are authenticated and your address is: 0x..."
  address = text.split(': ')[1].trim();

  publicAddressElm.textContent = `Session wallet: ${address}`;
  publicAddressElm.classList.remove('hidden');

  await displayENSProfile();
  await displayNFTs();
}

document.getElementById('connectWalletBtn').onclick = connectWallet;
document.getElementById('siweBtn').onclick           = signInWithEthereum;
document.getElementById('infoBtn').onclick           = getInformation;
