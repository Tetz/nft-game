import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Container, Button, Form, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import contractAddress from '../contracts/contract-address.json';
import CryptoPetABI from '../contracts/CryptoPet.json';
import MyTokenABI from '../contracts/MyToken.json';

const pixelSize = 10; // 10x10 pixel grid
const scale = 10; // scale each pixel to 10x10

const colors = [
  '#FF5733', '#33FF57', '#3357FF', '#F0E68C', '#FFC0CB', 
  '#8A2BE2', '#FFD700', '#FF4500', '#7CFC00', '#00FFFF', 
  '#8B008B', '#FF1493', '#4B0082', '#ADFF2F', '#FFDAB9', '#FF69B4'
]; // Array of colors

const decodePixelData = (pixelData) => {
  const canvas = document.createElement('canvas');
  canvas.width = pixelSize * scale;
  canvas.height = pixelSize * scale;
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < pixelData.length; i++) {
    const x = i % pixelSize;
    const y = Math.floor(i / pixelSize);
    ctx.fillStyle = colors[pixelData[i] % colors.length]; // Use the pixel data value to index into the colors array
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }

  // Adding eyes
  ctx.fillStyle = '#000000';
  ctx.fillRect(2 * scale, 2 * scale, scale, scale);
  ctx.fillRect(7 * scale, 2 * scale, scale, scale);

  // Adding mouth
  ctx.fillRect(4 * scale, 7 * scale, 3 * scale, scale);

  return canvas.toDataURL();
};


export const Dapp = () => {
  const [account, setAccount] = useState('');
  const [ethBalance, setEthBalance] = useState('');
  const [petContract, setPetContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [pet, setPet] = useState(null);
  const [petName, setPetName] = useState('');
  const [petImage, setPetImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBlockchainData = async () => {
      if (window.ethereum) {
        try {
          const web3 = new Web3(window.ethereum);
          await window.ethereum.enable();
          const accounts = await web3.eth.getAccounts();
          setAccount(accounts[0]);

          const ethBalance = await web3.eth.getBalance(accounts[0]);
          setEthBalance(web3.utils.fromWei(ethBalance, 'ether'));
          console.log(`ETH balance: ${web3.utils.fromWei(ethBalance, 'ether')} ETH`);

          const petContract = new web3.eth.Contract(CryptoPetABI.abi, contractAddress.CryptoPet);
          setPetContract(petContract);

          const tokenContract = new web3.eth.Contract(MyTokenABI.abi, contractAddress.Token);
          setTokenContract(tokenContract);

          const balance = await tokenContract.methods.balanceOf(accounts[0]).call();
          console.log(`Account balance: ${web3.utils.fromWei(balance, 'ether')} MTK`);

          loadPet(petContract, accounts[0]);
        } catch (error) {
          console.error('Error loading blockchain data:', error);
          setError('Error loading blockchain data');
        }
      }
    };

    const loadPet = async (contract, account) => {
      try {
        const pet = await contract.methods.getPet().call({ from: account });
        console.log('Pet loaded:', pet);
        setPet({
          name: pet.name,
          level: Number(pet.level),
          lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
          lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
        });
        setPetImage(decodePixelData(pet.pixelData));
      } catch (error) {
        console.error('No pet found', error);
        setError('No pet found');
      }
    };

    loadBlockchainData();
  }, []);

  const checkEthBalance = async (requiredAmount) => {
    const web3 = new Web3(window.ethereum);
    const balance = await web3.eth.getBalance(account);
    const balanceInEth = web3.utils.fromWei(balance, 'ether');
    if (parseFloat(balanceInEth) < requiredAmount) {
      setError(`Insufficient ETH balance. You need at least ${requiredAmount} ETH to perform this action.`);
      return false;
    }
    return true;
  };

  const sendTransaction = async (txObject) => {
    const web3 = new Web3(window.ethereum);
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 500000; // Adjust based on your contract's needs
    const nonce = await web3.eth.getTransactionCount(account, 'latest'); // 'pending' might be better in some cases

    return txObject.send({
      from: account,
      gasPrice,
      gas: gasLimit,
      nonce
    });
  };

  const createPet = async () => {
    try {
      const hasEnoughEth = await checkEthBalance(0.01); // Adjust the required amount based on actual gas cost
      if (!hasEnoughEth) return;

      console.log('Approving tokens for create pet...');
      const approveTx = await sendTransaction(tokenContract.methods.approve(contractAddress.CryptoPet, Web3.utils.toWei('10', 'ether')));
      console.log('Approval transaction:', approveTx);

      console.log('Creating pet with name:', petName);
      const createPetTx = await sendTransaction(petContract.methods.createPet(petName));
      console.log('Create pet transaction:', createPetTx);

      const pet = await petContract.methods.getPet().call({ from: account });
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
      setPetImage(decodePixelData(pet.pixelData));
    } catch (error) {
      console.error('Error creating pet:', error);
      setError('Error creating pet: ' + (error.message || error));
    }
  };

  const feedPet = async () => {
    try {
      const hasEnoughEth = await checkEthBalance(0.01); // Adjust the required amount based on actual gas cost
      if (!hasEnoughEth) return;

      console.log('Approving tokens for feed pet...');
      const approveTx = await sendTransaction(tokenContract.methods.approve(contractAddress.CryptoPet, Web3.utils.toWei('5', 'ether')));
      console.log('Approval transaction:', approveTx);

      console.log('Feeding pet...');
      const feedPetTx = await sendTransaction(petContract.methods.feedPet());
      console.log('Feed pet transaction:', feedPetTx);

      const pet = await petContract.methods.getPet().call({ from: account });
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
      setPetImage(decodePixelData(pet.pixelData));
    } catch (error) {
      console.error('Error feeding pet:', error);
      setError('Error feeding pet: ' + (error.message || error));
    }
  };

  const playWithPet = async () => {
    try {
      const hasEnoughEth = await checkEthBalance(0.01); // Adjust the required amount based on actual gas cost
      if (!hasEnoughEth) return;

      console.log('Approving tokens for play with pet...');
      const approveTx = await sendTransaction(tokenContract.methods.approve(contractAddress.CryptoPet, Web3.utils.toWei('5', 'ether')));
      console.log('Approval transaction:', approveTx);

      console.log('Playing with pet...');
      const playWithPetTx = await sendTransaction(petContract.methods.playWithPet());
      console.log('Play with pet transaction:', playWithPetTx);

      const pet = await petContract.methods.getPet().call({ from: account });
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
      setPetImage(decodePixelData(pet.pixelData));
    } catch (error) {
      console.error('Error playing with pet:', error);
      setError('Error playing with pet: ' + (error.message || error));
    }
  };

  const fastForwardTime = async () => {
    try {
      const hasEnoughEth = await checkEthBalance(0.01); // Adjust the required amount based on actual gas cost
      if (!hasEnoughEth) return;

      console.log('Fast forwarding time...');
      const fastForwardTx = await sendTransaction(petContract.methods.fastForwardTime(86400)); // Fast forward 24 hours
      console.log('Fast forward time transaction:', fastForwardTx);

      const pet = await petContract.methods.getPet().call({ from: account });
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
      setPetImage(decodePixelData(pet.pixelData));
    } catch (error) {
      console.error('Error fast forwarding time:', error);
      setError('Error fast forwarding time: ' + (error.message || error));
    }
  };

  return (
    <Container>
      <h1 className="text-center">Crypto Virtual Pet Game</h1>
      <p className="text-center">Your account: {account}</p>
      <p className="text-center">ETH balance: {ethBalance}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {pet ? (
        <Card className="text-center">
          <Card.Body>
            <Card.Title>{pet.name}</Card.Title>
            <Card.Text>Level: {pet.level}</Card.Text>
            <Card.Text>Last Fed: {pet.lastFed}</Card.Text>
            <Card.Text>Last Played: {pet.lastPlayed}</Card.Text>
            {petImage && <img src={petImage} alt="Pet" style={{ display: 'block', margin: '0 auto' }} />}
            <div className="mt-3">
              <Button onClick={feedPet} variant="primary" className="m-2">Feed Pet</Button>
              <Button onClick={playWithPet} variant="secondary" className="m-2">Play with Pet</Button>
              <Button onClick={fastForwardTime} variant="warning" className="m-2">Fast Forward Time</Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Form className="text-center">
          <Form.Group controlId="formPetName">
            <Form.Label>Pet Name</Form.Label>
            <Form.Control type="text" placeholder="Enter pet name" value={petName} onChange={(e) => setPetName(e.target.value)} />
          </Form.Group>
          <Button variant="primary" onClick={createPet}>Create Pet</Button>
        </Form>
      )}
    </Container>
  );
};
