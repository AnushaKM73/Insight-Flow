import torch

def get_sentiment(review, tokenizer, model):
    tokens = tokenizer.encode(review, return_tensors="pt", truncation=True, max_length=512)
    result = model(tokens)
    score = int(torch.argmax(result.logits)) + 1
    return score


def compare_products_logic(dataset, selected_products, tokenizer, model):

    result = []

    for product in selected_products:
        product_data = dataset[dataset['product_name'] == product]

        reviews = product_data['review_text'].tolist()
        ratings = product_data['rating'].tolist()

        sentiments = [get_sentiment(r, tokenizer, model) for r in reviews]

        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0

        result.append({
            "product": product,
            "avg_rating": round(avg_rating, 2),
            "avg_sentiment": round(avg_sentiment, 2),
            "total_reviews": len(reviews)
        })

    best_product = max(result, key=lambda x: x['avg_sentiment']) if result else {}

    return {
        "comparison": result,
        "best_product": best_product
    }