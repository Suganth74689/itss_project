# Sample Data

Banking CSV files for the AI assignment.

## Files

| File | Rows | Useful for |
|---|---|---|
| `customers.csv` | 120 | All topics |
| `accounts.csv` | 228 | Customer Q&A, fraud context |
| `loans.csv` | 160 | Eligibility, collections, exposure |
| `loan_applications.csv` | 180 | Loan decision / risk topics |
| `transactions.csv` | 650 | Fraud, spend brief, customer Q&A |
| `limits_collateral.csv` | 100 | Exposure / limit topics |

## Relationships

```text
customers.customer_id
   ├── accounts.customer_id
   ├── loans.customer_id
   ├── loan_applications.customer_id
   ├── transactions.customer_id
   └── limits_collateral.customer_id

accounts.account_id ← transactions.account_id
```

## Field dictionary

### customers.csv
| Column | Meaning |
|---|---|
| customer_id | Unique customer number |
| mnemonic | Short alternate reference |
| short_name | Short display name |
| name_1 | Full name |
| street / town_country | Address |
| nationality / residence | Country codes |
| sector | 1001 = retail individual, 2001 = business (simplified) |
| account_officer | Relationship manager code |
| kyc_status | COMPLETE / PENDING / EXPIRED |
| monthly_income / employment_type | Inputs for loan / advice topics |

### accounts.csv
| Column | Meaning |
|---|---|
| account_id | Account number |
| category | 1001 current-like, 6001 savings-like (simplified) |
| working_balance | Available balance |
| posting_restrict | e.g. KYC hold |

### loans.csv
| Column | Meaning |
|---|---|
| product | PERSONAL / HOME / BUSINESS |
| outstanding | Remaining principal |
| days_past_due | > 0 means overdue |
| collateral_value / limit_amount | Security and sanctioned limit |

### transactions.csv
| Column | Meaning |
|---|---|
| amount | Negative = debit, positive = credit |
| is_suspicious | Y / N label for fraud-style topics |

### loan_applications.csv
| Column | Meaning |
|---|---|
| requested_amount / tenure_months | Requested amount and tenure |
| credit_score / existing_emi | Risk inputs |
| decision_label | APPROVE / REFER / REJECT (for comparison demos) |

### limits_collateral.csv
| Column | Meaning |
|---|---|
| approved_limit / utilized / available | Exposure figures |
| collateral_type / collateral_value | Security context |
