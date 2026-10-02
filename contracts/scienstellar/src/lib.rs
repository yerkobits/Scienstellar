#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    Address, Env, String, Vec
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    PaperNotFound = 1,
    NotAuthorized = 2,
    InvalidAmount = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaperVersion {
    pub version: u32,
    pub timestamp: u64,
    pub magnet_link: String,
    pub content_hash: String,
    pub changelog: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Paper {
    pub id: u32,
    pub author_address: Address,
    pub author_name: String,
    pub title: String,
    pub abstract_text: String,
    pub category: String,
    pub versions: Vec<PaperVersion>,
    pub total_donations: i128,
}

#[contracttype]
pub enum DataKey {
    PaperCount,
    Paper(u32),
}

#[contract]
pub struct ScienstellarContract;

#[contractimpl]
impl ScienstellarContract {
    pub fn publish_paper(
        env: Env,
        author: Address,
        author_name: String,
        title: String,
        abstract_text: String,
        category: String,
        magnet_link: String,
        content_hash: String,
    ) -> u32 {
        author.require_auth();

        let mut count: u32 = env.storage().instance().get(&DataKey::PaperCount).unwrap_or(0);
        count += 1;

        let initial_version = PaperVersion {
            version: 1,
            timestamp: env.ledger().timestamp(),
            magnet_link,
            content_hash,
            changelog: String::from_str(&env, "Initial release"),
        };

        let mut versions = Vec::new(&env);
        versions.push_back(initial_version);

        let paper = Paper {
            id: count,
            author_address: author,
            author_name,
            title,
            abstract_text,
            category,
            versions,
            total_donations: 0,
        };

        env.storage().persistent().set(&DataKey::Paper(count), &paper);
        env.storage().instance().set(&DataKey::PaperCount, &count);

        count
    }

    pub fn add_version(
        env: Env,
        paper_id: u32,
        author: Address,
        magnet_link: String,
        content_hash: String,
        changelog: String,
    ) -> Result<(), Error> {
        author.require_auth();

        let mut paper: Paper = env
            .storage()
            .persistent()
            .get(&DataKey::Paper(paper_id))
            .ok_or(Error::PaperNotFound)?;

        if paper.author_address != author {
            return Err(Error::NotAuthorized);
        }

        let next_version = (paper.versions.len() as u32) + 1;
        let new_version = PaperVersion {
            version: next_version,
            timestamp: env.ledger().timestamp(),
            magnet_link,
            content_hash,
            changelog,
        };

        paper.versions.push_back(new_version);
        env.storage().persistent().set(&DataKey::Paper(paper_id), &paper);

        Ok(())
    }

    pub fn donate(
        env: Env,
        donor: Address,
        paper_id: u32,
        token_address: Address,
        amount: i128,
    ) -> Result<(), Error> {
        donor.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut paper: Paper = env
            .storage()
            .persistent()
            .get(&DataKey::Paper(paper_id))
            .ok_or(Error::PaperNotFound)?;

        let token_client = soroban_sdk::token::Client::new(&env, &token_address);
        token_client.transfer(&donor, &paper.author_address, &amount);

        paper.total_donations += amount;
        env.storage().persistent().set(&DataKey::Paper(paper_id), &paper);

        Ok(())
    }

    pub fn get_paper(env: Env, paper_id: u32) -> Result<Paper, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Paper(paper_id))
            .ok_or(Error::PaperNotFound)
    }

    pub fn get_papers_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::PaperCount).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
