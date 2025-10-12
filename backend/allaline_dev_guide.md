# 🚀 Allaline Dev Environment – Access Guide

Welcome to the **Allaline FA MVP Development** environment on AWS. Please follow this guide to connect to EC2, and access **S3**, **RDS**, and **Secrets Manager** programmatically.

---

## ✅ 1. EC2 Access (Remote Dev via SSH or VS Code)

### 🔐 Private Keys

You have received your SSH private key (`*_key`) via Line:
- `boss_key`, `kit_key`, `ploy_key`, etc.

### 👨‍💻 Your Linux Username
Your EC2 username is based on your key:
| Name  | Linux User |
|-------|------------|
| Boss  | `boss`     |
| Kit   | `kit`      |
| Ploy  | `ploy`     |

### 🌐 Allowed IP (CIDR)
You can access from:
```
203.158.1.0/24
(Suranaree University of Technology)
```

### 💻 VS Code Remote Guide
Access EC2 via VS Code:  
👉 [Using VSCode Remotely on EC2](https://medium.com/@christyjacob4/using-vscode-remotely-on-an-ec2-instance-7822c4032cff)

Or via Terminal:
```bash
ssh -i <your_key_file> <your_username>@34.239.206.0
```

---

## 📦 2. S3 – Accessing the Shared Bucket

### 🪣 Bucket: `allaline-fa-bucket`

Sample Python Code:
```python
import boto3
s3 = boto3.client('s3')
print(s3.list_buckets())
```

✅ If permissions are correct, you’ll get:
```json
'Buckets': [{'Name': 'allaline-fa-bucket', 'CreationDate': ... }]
```

---

## 🛢️ 3. RDS PostgreSQL

### Database Info:
- **Host**: `allaline-fa-database.cej2u40o8zq2.us-east-1.rds.amazonaws.com`
- **Port**: `5432`
- **DB Name**: `fadb`
- **User**: `postgres`
- **Password**: Retrieved via Secrets Manager

### 🔑 Retrieve Password (via Secrets Manager)
```python
import boto3
from botocore.exceptions import ClientError

def get_secret():
    secret_name = "rds!db-3b4c8ebc-4e5c-434e-a096-e2e523b52ebb"
    region_name = "us-east-1"
    client = boto3.session.Session().client('secretsmanager', region_name=region_name)
    response = client.get_secret_value(SecretId=secret_name)
    return response['SecretString']

print(get_secret())
```

✅ Example output:
```json
{"username":"postgres","password":"~gqO[0i5Eq5zJY!?.lsHwUIw[fsD"}
```

### 🧪 Connect via psql
```bash
psql -h allaline-fa-database.cej2u40o8zq2.us-east-1.rds.amazonaws.com -U postgres -d fadb -p 5432
```

then put in password.

---

## 🔐 4. Notes on Permissions

✅ From EC2, you can:
- Access **S3** (bucket list, upload, download)
- Access **RDS** (via psql or code)
- Access **SecretsManager** (to retrieve DB creds)

---

## ⚠️ Troubleshooting

- If access is denied, let me know.
- Ensure you're inside the **correct IP range (CIDR)**.
