use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_contract_flow() {
    let env = Env::default();
    
    // Simula las firmas de autorización para que require_auth() pase en el test
    env.mock_all_auths();

    let contract_id = env.register_contract(None, ScienstellarContract);
    let client = ScienstellarContractClient::new(&env, &contract_id);

    let author = Address::generate(&env);
    let id = client.publish_paper(
        &author,
        &String::from_str(&env, "Satoshi"),
        &String::from_str(&env, "Bitcoin P2P Cash"),
        &String::from_str(&env, "Abstract text"),
        &String::from_str(&env, "Blockchain"),
        &String::from_str(&env, "magnet:?xt=urn:btih:dummy"),
        &String::from_str(&env, "hash-sha256-dummy"),
    );

    assert_eq!(id, 1);
    assert_eq!(client.get_papers_count(), 1);

    let paper = client.get_paper(&1);
    assert_eq!(paper.author_name, String::from_str(&env, "Satoshi"));
}
