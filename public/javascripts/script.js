
function addToCart(fudId){
   $.ajax({
       url:'/add-to-cart/'+fudId,
       method:'get',
       success:(response)=>{
          if(response.status){
           let count = $('#cart-count').html()
           count=parseInt(count)+1
              $("#cart-count").html(count)
          }
             
      }
   })
   const Toast = Swal.mixin({
      toast: true,
      position: 'center',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      didOpen: (toast) => {
         toast.addEventListener('mouseenter', Swal.stopTimer)
         toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
   })
   Toast.fire({
      icon: 'success',
      title: 'Item added to Cart'
   })
  
  }
  
  
  
  function deleteWish(fudId){ 
   
     $.ajax({
        url:'/delete-wish/'+fudId,
        method:'get',
        success:(response)=>{
           location.reload()
        }
     })
     const Toast = Swal.mixin({
      toast: true,
      position: 'center',
      showConfirmButton: false,
      timer: 50000,
      timerProgressBar: true,
      didOpen: (toast) => {
         toast.addEventListener('mouseenter', Swal.stopTimer)
         toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
   })
   Toast.fire({
      icon: 'success',
      title: 'Removed from wishlist'
   })
  }
  
  // function addToWish(fudId){
  //     $.ajax({
  //         url:'/add-to-wish/'+fudId,
  //         method:'get',
  //         success:(response)=>{
  //            if(response.status){
  //             let count = $('#wish-count').html()
  //             count=parseInt(count)+1
  //                $("#wish-count").html(count)
  //            }
  //        }
  //     })
  //    }
  
  // function deleteWish(fudId){ 
  // 	$.ajax({
  // 		url:'/delete-wish/'+fudId,
  // 		method:'get',
  // 		success:(response)=>{
           
  // 		}
  // 	})
  // }
     
  
 
  
