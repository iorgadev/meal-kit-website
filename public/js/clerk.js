function openMealInfo(meal_id){
    let meal = document.getElementById(meal_id);
    if(meal != null){
        if(meal.style.display === "none"){
            meal.style.display = "block";
        }
        else {
            meal.style.display = "none";
        }
    }
}

const mealEditing = () => {
    let editLink = document.querySelectorAll(".edit_meal_link");
    for(let i = 0;i<editLink.length;i++){
        editLink[i].addEventListener("click", function(e){
            e.preventDefault();
        });
    }
}
mealEditing();



function deleteMeal(meal_id){
    let meal = document.getElementById(meal_id);

    const formData = new FormData();
    formData.append('meal_id', meal_id);

    var confirmDelete = confirm("Are you sure you want to delete this meal?");
    if(confirmDelete){
        fetch('../dashboard/deleteMeal', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            console.log('Success: ', result.message);
        })
        .catch(err => {
            console.log("Error deleting");
        });
    }
}

const mealDeleting = () => {
    let deleteLink = document.querySelectorAll(".delete_meal_link");
    for(let i = 0;i<deleteLink.length;i++){
        deleteLink[i].addEventListener("click", function(e){
            e.preventDefault();
        });
    }
}
mealDeleting();