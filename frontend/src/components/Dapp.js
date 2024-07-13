import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Container, Button, Form, Card, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import contractAddress from '../contracts/contract-address.json';
import CryptoPetABI from '../contracts/CryptoPet.json';

const pixelSize = 10; // 10x10 pixel grid
const scale = 10; // scale each pixel to 10x10

const decodePixelData = (pixelData) => {
  const canvas = document.createElement('canvas');
  canvas.width = pixelSize * scale;
  canvas.height = pixelSize * scale;
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < pixelData.length; i++) {
    const x = i % pixelSize;
    const y = Math.floor(i / pixelSize);
    ctx.fillStyle = pixelData[i] === '1' ? '#000000' : '#FFFFFF';
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }

  return canvas.toDataURL();
};

export const Dapp = () => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
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
          const contract = new web3.eth.Contract(CryptoPetABI.abi, contractAddress.CryptoPet);
          setContract(contract);
          loadPet(contract, accounts[0]);
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

  const createPet = async () => {
    try {
      console.log('Creating pet with name:', petName);
      await contract.methods.createPet(petName).send({ from: account, gas: 500000 });
      console.log('Pet created');
      const pet = await contract.methods.getPet().call({ from: account });
      console.log('Pet loaded after creation:', pet);
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
      setPetImage(decodePixelData(pet.pixelData));
    } catch (error) {
      console.error('Error creating pet:', error);
      setError('Error creating pet');
    }
  };

  const feedPet = async () => {
    try {
      await contract.methods.feedPet().send({ from: account, gas: 500000 });
      const pet = await contract.methods.getPet().call({ from: account });
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
      setPetImage(decodePixelData(pet.pixelData));
    } catch (error) {
      console.error('Error feeding pet:', error);
      setError('Error feeding pet');
    }
  };

  const playWithPet = async () => {
    try {
      console.log('Playing with pet...');
      await contract.methods.playWithPet().send({ from: account, gas: 500000 });
      const pet = await contract.methods.getPet().call({ from: account });
      console.log('Pet after playing:', pet);
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
      setPetImage(decodePixelData(pet.pixelData));
    } catch (error) {
      console.error('Error playing with pet:', error);
      setError('Error playing with pet');
    }
  };

  const fastForwardTime = async () => {
    try {
      await contract.methods.fastForwardTime(86400).send({ from: account, gas: 500000 }); // Fast forward 24 hours
      const pet = await contract.methods.getPet().call({ from: account });
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
      setPetImage(decodePixelData(pet.pixelData));
    } catch (error) {
      console.error('Error fast forwarding time:', error);
      setError('Error fast forwarding time');
    }
  };

  return (
    <Container>
      <h1 className="text-center">Crypto Virtual Pet Game</h1>
      <p className="text-center">Your account: {account}</p>
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
