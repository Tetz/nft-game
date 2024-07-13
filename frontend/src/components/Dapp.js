import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Container, Button, Form, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import contractAddress from '../contracts/contract-address.json';
import CryptoPetABI from '../contracts/CryptoPet.json';

export const Dapp = () => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [pet, setPet] = useState(null);
  const [petName, setPetName] = useState('');
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
      await contract.methods.createPet(petName).send({ from: account, gas: 300000 });
      console.log('Pet created');
      const pet = await contract.methods.getPet().call({ from: account });
      console.log('Pet loaded after creation:', pet);
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
    } catch (error) {
      console.error('Error creating pet:', error);
      setError('Error creating pet');
    }
  };

  const feedPet = async () => {
    try {
      await contract.methods.feedPet().send({ from: account, gas: 300000 });
      const pet = await contract.methods.getPet().call({ from: account });
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
    } catch (error) {
      console.error('Error feeding pet:', error);
      setError('Error feeding pet');
    }
  };

  const playWithPet = async () => {
    try {
      console.log('Playing with pet...');
      await contract.methods.playWithPet().send({ from: account, gas: 300000 });
      const pet = await contract.methods.getPet().call({ from: account });
      console.log('Pet after playing:', pet);
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
    } catch (error) {
      console.error('Error playing with pet:', error);
      setError('Error playing with pet');
    }
  };

  const fastForwardTime = async () => {
    try {
      await contract.methods.fastForwardTime(86400).send({ from: account, gas: 300000 }); // Fast forward 24 hours
      const pet = await contract.methods.getPet().call({ from: account });
      setPet({
        name: pet.name,
        level: Number(pet.level),
        lastFed: new Date(Number(pet.lastFed) * 1000).toLocaleString(),
        lastPlayed: new Date(Number(pet.lastPlayed) * 1000).toLocaleString()
      });
    } catch (error) {
      console.error('Error fast forwarding time:', error);
      setError('Error fast forwarding time');
    }
  };

  return (
    <Container>
      <h1>Crypto Virtual Pet Game</h1>
      <p>Your account: {account}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {pet ? (
        <Card>
          <Card.Body>
            <Card.Title>{pet.name}</Card.Title>
            <Card.Text>Level: {pet.level}</Card.Text>
            <Card.Text>Last Fed: {pet.lastFed}</Card.Text>
            <Card.Text>Last Played: {pet.lastPlayed}</Card.Text>
            <Button onClick={feedPet} variant="primary">Feed Pet</Button>
            <Button onClick={playWithPet} variant="secondary" className="ml-2">Play with Pet</Button>
            <Button onClick={fastForwardTime} variant="warning" className="ml-2">Fast Forward Time</Button>
          </Card.Body>
        </Card>
      ) : (
        <Form>
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
